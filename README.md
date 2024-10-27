# Accelerated image processing using JAX for surveillance camera assistance

The rise of artificial intelligence in security and surveillance has led to an increased demand for high-performance image processing systems. Surveillance cameras, especially in areas with high traffic like airports, shopping malls, and public transit stations, require rapid and efficient processing of video feeds to assist with monitoring. Here, the use of JAX, a high-performance numerical computing library developed by Google, emerges as a game-changer. Leveraging JAX for image processing in surveillance applications enables faster computations, which is really needed when talking about multiple video feeds processed in real-time. 

We have developed an application to do just this, taking in multiple video feeds, analysing them with the use of some basic image processing algorithms and displaying the most important feeds to the end user.

---

## What is JAX?

JAX is an open-source library built on top of NumPy, designed to facilitate high-performance numerical computing. The primary strengths of JAX lie in its ability to leverage automatic differentiation (Autograd) and support Just-In-Time (JIT) compilation using the XLA (Accelerated Linear Algebra) compiler. With these features, JAX efficiently offloads computation to GPUs or TPUs, providing significant performance benefits for image processing tasks, which are often resource-intensive.

### Why use JAX for video processing?
1. JAX’s JIT compiler transforms functions into highly optimized machine code, allowing faster execution, critical for real-time surveillance.
2. JAX enables easy scaling of workloads across multiple devices, which is beneficial in large-scale surveillance networks.
3. JAX's pythonic design allows for fast development, ensuring features can be modified and added quickly to the product according the needs of the consumer.
### Key Use Cases in Surveillance Image Processing

1. **Object Detection**: Detecting and tracking objects (e.g., people, vehicles) from live camera feeds.
2. **Activity Recognition**: Identifying which of the video feeds have something happening in them to flag in the system
3. **Anomaly Detection**: Recognizing abnormal behavior by analyzing patterns in real-time data feeds.

In our MVP we have just implemented Activity Recognition which can complement the other features, it would not be wise to implement anomaly detection of a static video feed.

---

## Getting into the nitty-gritty 

Let's walk through a basic image processing pipeline in JAX.

### Preprocessing

To reduce computational overhead, we need to discard necessary information from our frames. Some basic steps we can take is converting images to grayscale, reducing the resolution of the image. In this part we also want to normalize luminance, this will help with our algorithm later on. 
#### Step 1: Grayscale Conversion

For the bulk of the project we will be using jax.numpy which has accelerated versions of a lot of the functions of python's numpy. In our case, a simple way to convert the RGB image to grayscale is to get the mean of the three colour channels.

```python
import  jax.numpy as jnp

def to_grayscale(img):
	# JAX expects jax.numpy arrays, which work similarly to NumPy
	return jnp.mean(img, axis = 2) #The above will convert the image (x,y,3) to (x,y) 
```


#### Step 2: Reducing Resolution

Here, as well as reducing the resolution, we will resize the image into a square, we do this to help with a part of the algorithm coming up. Here jax has a useful function to resize the images, this can also be used if at a later time we want to implement some kind of image classification, where the input is restricted to a standard resolution. 

```python
import jax 

def resize_to_square(img, side_length):
	#Resizes an image to a square with the specified side length
	return jax.image.resize(img, (side_length, side_length), method='bilinear')
```

#### Step 3: Normalize Luminance 

Normalizing the image's luminance is an important part of the process. Let's say a cloud covers the sun and the video feed becomes darker, we do not want our system to flag this as an important event, so normalizing luminance helps with unimportant changes like this. 

```python
import jax
import jax.numpy as jnp

def normalize_lumincance(img):
	#Normalizes the luminance values of an image so that the min value is 0 and the max value is 255
	image = img.astype(jnp.float32)
	normalized = (image - jnp.min(image)) / (jnp.max(image) - jnp.min(image))
	normalized = normalized * 255
	return normalized.astype(jnp.uint8)
```

### Algorithms 

There are a *lot* of algorithms that fall under the domain of Image Processing, we have selected two that best fit the problem at hand. To understand why these two were selected we first need to understand our problem domain. We are trying to compare pairs of frames, if the two frames are significantly different, it means that the feed might have some significant activity in it. We need an algorithm that is sensitive enough to detect some activity (e.g. a person walking into frame), but not to sensitive where any slight change is detected (e.g. camera artifacts or a branch of a tree slightly moving).

#### 1) Structural Similarity Index Measure (SSIM)

$${\displaystyle {\hbox{SSIM}}(x,y)={\frac {(2\mu _{x}\mu _{y}+c_{1})(2\sigma _{xy}+c_{2})}{(\mu _{x}^{2}+\mu _{y}^{2}+c_{1})(\sigma _{x}^{2}+\sigma _{y}^{2}+c_{2})}}}$$
Unlike simple pixel differencing, SSIM assesses changes based on luminance, contrast, and structure, which makes it ideal for detecting meaningful shifts while ignoring minor noise or lighting fluctuations. By setting an SSIM threshold, the system can control sensitivity, identifying significant structural changes that indicate activity without being overly sensitive to background noise. This makes SSIM highly adaptable and efficient for real-time applications, helping video monitoring systems detect and flag potential events with greater accuracy and fewer false positives.


$${\displaystyle {\hbox{SSIM}}(x,y)={\frac {(2\mu _{x}\mu _{y}+c_{1})(2\sigma _{xy}+c_{2})}{(\mu _{x}^{2}+\mu _{y}^{2}+c_{1})(\sigma _{x}^{2}+\sigma _{y}^{2}+c_{2})}}}$$
Where $x$ and $y$ are square tiles of the image, $μ_x$ and $μ_y$ are the mean of pixel values in the tiles, $σ_x$ and $σ_y$ are the variance and $σ_{xy}$ is the covariance of $x$ and $y$. $c_1$ and $c_2$ are used to stabilize division.

To use the algorithm we first need to break down the image into tiles 

```python
def get_tiles(img, subdiv=5):
    #Splits an image into a grid of smaller tiles.

    # Calculate the side length of each tile based on the image size and subdivisions.
    tile_size = img.shape[0] // subdiv

    # Define a helper function to slice out a single tile from the image given grid indices (i, j).
    def slice_tile(i, j):
        start_indices = jnp.array([i * tile_size, j * tile_size])
        slice_sizes = jnp.array([tile_size, tile_size])# Define the slice size for the tile (it will always be square with dimensions tile_size x tile_size).
        return jax.lax.dynamic_slice(img, start_indices, slice_sizes)# Use JAX's `dynamic_slice` to extract the tile from the image at the specified start coordinates.

    # Define a helper function to generate all tile index pairs for grid positions.
    def generate_indices(subdiv):
        #Helper function to generate all possible grid indices (i, j) for tiles.'''
        # `i_indices` repeats row indices for each column in the grid, while `j_indices` tiles column indices.
        i_indices = jnp.repeat(jnp.arange(subdiv), subdiv)
        j_indices = jnp.tile(jnp.arange(subdiv), subdiv)
        return jnp.stack((i_indices, j_indices), axis=-1)# Stack row and column indices together to form (i, j) pairs for each tile.
    
    # Generate a list of all (i, j) pairs covering the grid based on the specified subdivisions.
    indices = generate_indices(subdiv)

    # Map each (i, j) index to its corresponding tile by applying `slice_tile` to each pair.
    tiles = jax.vmap(lambda idx: slice_tile(idx[0], idx[1]))(indices)

    # Stack all extracted tiles into a single array for easier handling and return.
    return jnp.stack(tiles)

```

After getting the tiles, we then need to compute SSIM

```python
def ssim(img_1, img_2, subdiv=10):
	def get_ssim_tile(tile_1, tile_2):	
		mu_x = jnp.mean(tile_1)	
		mu_y = jnp.mean(tile_2)	
		sigma_x = jnp.std(tile_1)	
		sigma_y = jnp.std(tile_2)	
		sigma_xy = jnp.mean((tile_1 - mu_x) * (tile_2 - mu_y)) #covariance
		
		c1 = 0.01	
		c2 = 0.03
		
		ssim = (2 * mu_x * mu_y + c1) * (2 * sigma_xy + c2) / ((mu_x**2 + mu_y**2 + c1) * (sigma_x**2 + sigma_y**2 + c2))
		return ssim
	
	tiles_1 = get_tiles(img_1, subdiv)
	tiles_2 = get_tiles(img_2, subdiv)
	ssim_values = jax.vmap(get_ssim_tile)(tiles_1, tiles_2)
	
	return jnp.mean(ssim_values)
```

#### 2) MSE + Blur

The second algorithm is a simple Mean Squares Error but blurring the image first to attempt to reduce the effect of small pixel sized changes that might affect the output. 

```python
def blur(img, window=50):
	#Simple gaussian blurr
	x = jnp.linspace(-3, 3, window)
	window = jsp.stats.norm.pdf(x) * jsp.stats.norm.pdf(x[:, None])
	window = window / jnp.sum(window, keepdims=True)
	return jsp.signal.convolve2d(img, window, mode='same')

def mse(img_1, img_2):
	blur_img_1 = blur(img_1, 50)#need a sufficiently large window to see good results
	blur_img_2 = blur(img_2, 50)	
	return jnp.mean((blur_img_1 - blur_img_2)**2)
	
```

#### Combining the algorithms

After getting the scores from both algorithms we then need to combine the two results. Here, a simple weighting of each algorithm can help. 

```python

def get_scores(frame1, frame2, w1=0.75, w2=0.25):
	frame1 = frame1[:, :, :3]	
	frame2 = frame2[:, :, :3]
	
	assert w1 + w2 == 1, "Weights must sum to 1"
	
	f1 = resize_square(normalize_lumincance(to_grayscale(frame1)))#preprocessing
	f2 = resize_square(normalize_lumincance(to_grayscale(frame2)))
	
	ssim_score = ssim(f1, f2)
	mse_score = mse(f1, f2)

	def norm_mse(z, slope=80):
		return 1/(z/slope + 1)
		
	norm_mse_score = norm_mse(mse_score)
	
	return w1 * ssim_score + w2 * norm_mse_score
```

